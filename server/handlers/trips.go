package handlers

import (
	"encoding/json"
	"net/http"
	"roady-server/db"
	"roady-server/models"
)

func GetTrips(w http.ResponseWriter, r *http.Request) {
	userId := r.URL.Query().Get("userId")
	if userId == "" {
		http.Error(w, "userId is required", http.StatusBadRequest)
		return
	}

	rows, err := db.DB.Query("SELECT id, user_id, name, start_time, end_time, distance, duration, status, source, destination, vehicle_make, vehicle_model, vehicle_year FROM trips WHERE user_id = $1 ORDER BY start_time DESC", userId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	trips := []models.Trip{}
	for rows.Next() {
		var trip models.Trip
		var vMake, vModel *string
		var vYear *int

		if err := rows.Scan(&trip.ID, &trip.UserID, &trip.Name, &trip.StartTime, &trip.EndTime, &trip.Distance, &trip.Duration, &trip.Status, &trip.Source, &trip.Destination, &vMake, &vModel, &vYear); err != nil {
			continue
		}
		
		if vMake != nil || vModel != nil || vYear != nil {
			trip.Vehicle = &models.Vehicle{}
			if vMake != nil { trip.Vehicle.Make = *vMake }
			if vModel != nil { trip.Vehicle.Model = *vModel }
			if vYear != nil { trip.Vehicle.Year = *vYear }
		}
		
		// Fetch route points for each trip (simplified, might be heavy for list view)
		// In a real app, you'd probably only fetch route on detail view
		// But for this demo, we'll leave route empty or fetch it if needed.
		// The client interface expects `route` in `Trip`.
		
		// Let's fetch a simplified route or just leave it empty for the list
		trip.Route = []models.GPSPoint{} 
		
		trips = append(trips, trip)
	}

	json.NewEncoder(w).Encode(trips)
}
