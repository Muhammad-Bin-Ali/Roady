import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import type { GPSPoint } from '@/types/models';

// --- Types ---

export interface GpsBufferConfig {
  batchSize: number;
  filenamePrefix: string;
  directory: Directory;
}

// --- Constants ---

const DEFAULT_CONFIG: GpsBufferConfig = {
  batchSize: 50,
  filenamePrefix: 'trip_buffer_',
  directory: Directory.Data, // Use Data directory for persistent storage
};

// --- GpsBuffer Module ---

export class GpsBuffer {
  private currentTripId: string | null = null;
  private config: GpsBufferConfig;
  private isWriting: boolean = false;

  constructor(config: Partial<GpsBufferConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Checks for an existing partial trip buffer on startup.
   * If found, resumes that trip.
   */
  async resumeIfNeeded(): Promise<string | null> {
    try {
      const files = await Filesystem.readdir({
        path: '',
        directory: this.config.directory,
      });

      // Find the first file matching our prefix
      const bufferFile = files.files.find((f) => 
        f.name.startsWith(this.config.filenamePrefix) && f.name.endsWith('.jsonl')
      );

      if (bufferFile) {
        // Extract tripId from filename: trip_buffer_{tripId}.jsonl
        const tripId = bufferFile.name
          .replace(this.config.filenamePrefix, '')
          .replace('.jsonl', '');
        
        this.currentTripId = tripId;
        console.log(`[GpsBuffer] Resuming trip: ${tripId}`);
        
        // Repair file if needed (remove partial writes)
        await this._repairBuffer();
        
        return tripId;
      }
    } catch (error) {
      console.error('[GpsBuffer] Error checking for resume:', error);
    }
    return null;
  }

  /**
   * Starts a new trip. Ensures no other trip is active.
   */
  async startTrip(tripId: string): Promise<void> {
    if (this.currentTripId) {
      throw new Error(`Trip ${this.currentTripId} is already active.`);
    }

    this.currentTripId = tripId;
    const filename = this._getFilename(tripId);

    // Ensure file exists (create empty)
    try {
      await Filesystem.writeFile({
        path: filename,
        data: '',
        directory: this.config.directory,
        encoding: Encoding.UTF8,
      });
    } catch (error) {
      console.error('[GpsBuffer] Failed to create buffer file:', error);
      throw error;
    }
  }

  /**
   * Appends a new GPS point to the local buffer.
   * This is an append-only operation for speed and safety.
   */
  async appendPoint(point: GPSPoint): Promise<void> {
    if (!this.currentTripId) {
      throw new Error('No active trip.');
    }

    const line = JSON.stringify(point) + '\n';
    const filename = this._getFilename(this.currentTripId);

    try {
      await Filesystem.appendFile({
        path: filename,
        data: line,
        directory: this.config.directory,
        encoding: Encoding.UTF8,
      });
    } catch (error) {
      console.error('[GpsBuffer] Failed to append point:', error);
      // In a real app, you might want to cache in memory temporarily if disk fails
      throw error;
    }
  }

  /**
   * Reads the next batch of pending points from the head of the file.
   * Does NOT remove them yet.
   */
  async readPendingPoints(batchSize: number = this.config.batchSize): Promise<GPSPoint[]> {
    if (!this.currentTripId) return [];

    const filename = this._getFilename(this.currentTripId);
    
    try {
      // Note: Capacitor's readFile reads the whole file. 
      // For very large files, this could be a memory issue.
      // A production optimization would be to use a plugin with stream support 
      // or rotate files (e.g. trip_buffer_part1.jsonl).
      // For this implementation, we assume the buffer is kept reasonably small by the uploader.
      const result = await Filesystem.readFile({
        path: filename,
        directory: this.config.directory,
        encoding: Encoding.UTF8,
      });

      const content = typeof result.data === 'string' ? result.data : '';
      if (!content) return [];

      const lines = content.split('\n').filter(line => line.trim() !== '');
      const batchLines = lines.slice(0, batchSize);

      const points: GPSPoint[] = [];
      for (const line of batchLines) {
        try {
          points.push(JSON.parse(line));
        } catch (e) {
          console.warn('[GpsBuffer] Skipping malformed line:', line);
        }
      }

      return points;
    } catch (error) {
      // File might not exist if we haven't written yet, which is fine
      return [];
    }
  }

  /**
   * Removes the first `count` points from the buffer file.
   * This is called after a successful upload.
   */
  async markBatchUploaded(count: number): Promise<void> {
    if (!this.currentTripId || count <= 0) return;

    if (this.isWriting) {
      // Simple concurrency lock to prevent race conditions during rewrite
      // In a robust system, use a proper queue or mutex
      await new Promise(resolve => setTimeout(resolve, 100));
      return this.markBatchUploaded(count);
    }

    this.isWriting = true;
    const filename = this._getFilename(this.currentTripId);

    try {
      const result = await Filesystem.readFile({
        path: filename,
        directory: this.config.directory,
        encoding: Encoding.UTF8,
      });

      const content = typeof result.data === 'string' ? result.data : '';
      const lines = content.split('\n').filter(line => line.trim() !== '');

      // If we uploaded everything, just clear the file
      if (count >= lines.length) {
        await Filesystem.writeFile({
          path: filename,
          data: '',
          directory: this.config.directory,
          encoding: Encoding.UTF8,
        });
      } else {
        // Keep remaining lines
        const remainingLines = lines.slice(count);
        const newContent = remainingLines.join('\n') + '\n';

        await Filesystem.writeFile({
          path: filename,
          data: newContent,
          directory: this.config.directory,
          encoding: Encoding.UTF8,
        });
      }
    } catch (error) {
      console.error('[GpsBuffer] Failed to truncate buffer:', error);
    } finally {
      this.isWriting = false;
    }
  }

  /**
   * Ends the trip, returns any remaining points, and deletes the buffer file.
   */
  async endTrip(): Promise<GPSPoint[]> {
    if (!this.currentTripId) return [];

    const filename = this._getFilename(this.currentTripId);
    let remainingPoints: GPSPoint[] = [];

    try {
      // Read everything left
      const result = await Filesystem.readFile({
        path: filename,
        directory: this.config.directory,
        encoding: Encoding.UTF8,
      });

      const content = typeof result.data === 'string' ? result.data : '';
      const lines = content.split('\n').filter(line => line.trim() !== '');
      
      remainingPoints = lines.map(line => {
        try { return JSON.parse(line); } catch { return null; }
      }).filter(p => p !== null) as GPSPoint[];

      // Delete the file
      await Filesystem.deleteFile({
        path: filename,
        directory: this.config.directory,
      });

    } catch (error) {
      console.warn('[GpsBuffer] Error ending trip (file might be missing):', error);
    } finally {
      this.currentTripId = null;
    }

    return remainingPoints;
  }

  /**
   * Clears all buffer files (emergency cleanup).
   */
  async clear(): Promise<void> {
    try {
      const files = await Filesystem.readdir({
        path: '',
        directory: this.config.directory,
      });

      for (const file of files.files) {
        if (file.name.startsWith(this.config.filenamePrefix)) {
          await Filesystem.deleteFile({
            path: file.name,
            directory: this.config.directory,
          });
        }
      }
      this.currentTripId = null;
    } catch (error) {
      console.error('[GpsBuffer] Error clearing buffers:', error);
    }
  }

  // --- Internal Helpers ---

  private _getFilename(tripId: string): string {
    return `${this.config.filenamePrefix}${tripId}.jsonl`;
  }

  /**
   * Reads the file and removes the last line if it's incomplete/malformed.
   * This handles crash recovery where the app died mid-write.
   */
  private async _repairBuffer(): Promise<void> {
    if (!this.currentTripId) return;
    const filename = this._getFilename(this.currentTripId);

    try {
      const result = await Filesystem.readFile({
        path: filename,
        directory: this.config.directory,
        encoding: Encoding.UTF8,
      });

      const content = typeof result.data === 'string' ? result.data : '';
      if (!content) return;

      const lines = content.split('\n');
      // If the last line is empty (standard newline at EOF), check the one before
      // But split('\n') on "a\nb\n" gives ["a", "b", ""].
      
      // We want to validate the last non-empty line
      let validContent = content;
      let needsWrite = false;

      // Check all lines for validity, or just the last one?
      // Usually only the last one is corrupted on crash.
      const nonEmptyLines = lines.filter(l => l.trim().length > 0);
      if (nonEmptyLines.length > 0) {
        const lastLine = nonEmptyLines[nonEmptyLines.length - 1];
        try {
          JSON.parse(lastLine);
        } catch (e) {
          console.warn('[GpsBuffer] Found corrupted last line, repairing...');
          // Remove the last line
          nonEmptyLines.pop();
          validContent = nonEmptyLines.join('\n') + '\n';
          needsWrite = true;
        }
      }

      if (needsWrite) {
        await Filesystem.writeFile({
          path: filename,
          data: validContent,
          directory: this.config.directory,
          encoding: Encoding.UTF8,
        });
      }

    } catch (error) {
      console.error('[GpsBuffer] Error repairing buffer:', error);
    }
  }
}

// --- Retry Scheduler Module ---

export type UploadCallback = (points: GPSPoint[]) => Promise<void>;

export class RetryScheduler {
  private buffer: GpsBuffer;
  private uploadFn: UploadCallback;
  private isRunning: boolean = false;
  private isUploading: boolean = false;
  private timer: ReturnType<typeof setTimeout> | null = null;
  
  // Backoff configuration
  private retryDelayMs = 5000;
  private readonly minDelay = 5000;
  private readonly maxDelay = 30000;

  constructor(buffer: GpsBuffer, uploadFn: UploadCallback) {
    this.buffer = buffer;
    this.uploadFn = uploadFn;
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.retryDelayMs = this.minDelay;
    this._scheduleNext();
  }

  stop() {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  /**
   * Call this whenever new points are added to trigger an immediate check
   * if the scheduler is idle.
   */
  trigger() {
    if (!this.isRunning) this.start();
    if (!this.isUploading && !this.timer) {
      this._attemptUpload();
    }
  }

  private _scheduleNext() {
    if (!this.isRunning) return;
    if (this.timer) clearTimeout(this.timer);

    this.timer = setTimeout(() => {
      this._attemptUpload();
    }, this.retryDelayMs);
  }

  private async _attemptUpload() {
    if (this.isUploading) return;
    this.isUploading = true;

    try {
      // 1. Read pending points
      const points = await this.buffer.readPendingPoints();
      
      if (points.length === 0) {
        // Nothing to upload, stop scheduling until triggered again
        this.isUploading = false;
        this.timer = null;
        return; 
      }

      // 2. Attempt upload
      await this.uploadFn(points);

      // 3. On success: remove from buffer
      await this.buffer.markBatchUploaded(points.length);

      // 4. Reset backoff and schedule next immediately (to drain buffer)
      this.retryDelayMs = this.minDelay;
      this.isUploading = false;
      
      // If we had a full batch, there might be more. Go again immediately.
      this._attemptUpload();

    } catch (error) {
      console.error('[RetryScheduler] Upload failed, backing off:', error);
      
      // 5. On failure: increase backoff
      this.retryDelayMs = Math.min(this.retryDelayMs * 2, this.maxDelay);
      this.isUploading = false;
      this._scheduleNext();
    }
  }
}
