package main

import (
	"fmt"
	"log"
	"net/http"
	"roady-server/db"
	"roady-server/handlers"
)

func main() {
	db.Init()

	http.HandleFunc("/auth/signup", enableCors(handlers.SignUp))
	http.HandleFunc("/auth/login", enableCors(handlers.Login))
	http.HandleFunc("/auth/me", enableCors(handlers.ValidateSession))

	http.HandleFunc("/trips", enableCors(handlers.GetTrips))

	http.HandleFunc("/tracking/start", enableCors(handlers.StartTrip))
	http.HandleFunc("/tracking/stop", enableCors(handlers.StopTrip))
	http.HandleFunc("/tracking/points", enableCors(handlers.UploadPoints))

	port := ":8080"
	fmt.Printf("Server starting on port %s\n", port)
	if err := http.ListenAndServe(port, nil); err != nil {
		log.Fatal(err)
	}
}

func enableCors(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

		if r.Method == "OPTIONS" {
			return
		}

		next(w, r)
	}
}
