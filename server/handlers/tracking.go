package handlers

import (
	"encoding/json"
	"net/http"
	"roady-server/db"
	"roady-server/models"
	"time"
)

func StartTrip(w http.ResponseWriter, r *http.Request) {
	var req models.StartTripRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	name := "Trip " + time.Now().Format("2006-01-02")
	if n, ok := req.Metadata["name"].(string); ok {
		name = n
	}

	var tripId string
	startTime := time.Now()

	var vehicleMake, vehicleModel *string
	var vehicleYear *int

	if req.Vehicle != nil {
		vehicleMake = &req.Vehicle.Make
		vehicleModel = &req.Vehicle.Model
		vehicleYear = &req.Vehicle.Year
	}

	err := db.DB.QueryRow(
		`INSERT INTO trips (user_id, name, start_time, status, source, destination, vehicle_make, vehicle_model, vehicle_year) 
		 VALUES ($1, $2, $3, 'active', $4, $5, $6, $7, $8) RETURNING id`,
		req.UserID, name, startTime, req.Source, req.Destination, vehicleMake, vehicleModel, vehicleYear,
	).Scan(&tripId)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(models.StartTripResponse{
		Success:   true,
		TripID:    tripId,
		StartTime: startTime,
	})
}

func StopTrip(w http.ResponseWriter, r *http.Request) {
	var req models.StopTripRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	endTime := time.Now()

	// Calculate duration and distance (simplified: just update end time and status)
	// In a real app, you'd calculate distance from points here or incrementally

	var trip models.Trip
	err := db.DB.QueryRow(
		`UPDATE trips 
		SET end_time = $1, status = 'completed', 
		    duration = EXTRACT(EPOCH FROM ($1 - start_time))
		WHERE id = $2 AND user_id = $3
		RETURNING id, user_id, name, start_time, end_time, distance, duration, status`,
		endTime, req.TripID, req.UserID,
	).Scan(&trip.ID, &trip.UserID, &trip.Name, &trip.StartTime, &trip.EndTime, &trip.Distance, &trip.Duration, &trip.Status)

	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Fetch points for the route
	rows, err := db.DB.Query("SELECT latitude, longitude, timestamp FROM points WHERE trip_id = $1 ORDER BY timestamp", trip.ID)
	if err == nil {
		defer rows.Close()
		for rows.Next() {
			var p models.GPSPoint
			if err := rows.Scan(&p.Latitude, &p.Longitude, &p.Timestamp); err == nil {
				trip.Route = append(trip.Route, p)
			}
		}
	}

	json.NewEncoder(w).Encode(models.StopTripResponse{
		Success: true,
		Trip:    &trip,
	})
}

func UploadPoints(w http.ResponseWriter, r *http.Request) {
	var req models.UploadPointsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	tx, err := db.DB.Begin()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	stmt, err := tx.Prepare(`
		INSERT INTO points (trip_id, latitude, longitude, altitude, accuracy, speed, heading, timestamp)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`)
	if err != nil {
		tx.Rollback()
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer stmt.Close()

	for _, p := range req.Points {
		_, err := stmt.Exec(req.TripID, p.Latitude, p.Longitude, p.Altitude, p.Accuracy, p.Speed, p.Heading, p.Timestamp)
		if err != nil {
			tx.Rollback()
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	if err := tx.Commit(); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
