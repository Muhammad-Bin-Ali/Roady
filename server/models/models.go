package models

import "time"

type User struct {
	ID        string    `json:"id"`
	Email     string    `json:"email"`
	Username  string    `json:"username"`
	CreatedAt time.Time `json:"createdAt"`
	Password  string    `json:"-"` // Don't return password in JSON
}

type Vehicle struct {
	Make  string `json:"make"`
	Model string `json:"model"`
	Year  int    `json:"year"`
}

type Trip struct {
	ID          string     `json:"id"`
	UserID      string     `json:"userId"`
	Name        string     `json:"name"`
	StartTime   time.Time  `json:"startTime"`
	EndTime     *time.Time `json:"endTime,omitempty"`
	Distance    float64    `json:"distance"`
	Duration    float64    `json:"duration"`
	Status      string     `json:"status"`
	Route       []GPSPoint `json:"route,omitempty"`
	Source      string     `json:"source,omitempty"`
	Destination string     `json:"destination,omitempty"`
	Vehicle     *Vehicle   `json:"vehicle,omitempty"`
}

type GPSPoint struct {
	Latitude  float64   `json:"latitude"`
	Longitude float64   `json:"longitude"`
	Altitude  *float64  `json:"altitude,omitempty"`
	Accuracy  *float64  `json:"accuracy,omitempty"`
	Speed     *float64  `json:"speed,omitempty"`
	Heading   *float64  `json:"heading,omitempty"`
	Timestamp time.Time `json:"timestamp"`
}

// API Request/Response Types

type SignUpRequest struct {
	Email    string `json:"email"`
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginRequest struct {
	EmailOrUsername string `json:"emailOrUsername"`
	Password        string `json:"password"`
}

type AuthResponse struct {
	Success bool   `json:"success"`
	User    *User  `json:"user,omitempty"`
	Token   string `json:"token,omitempty"`
	Error   string `json:"error,omitempty"`
}

type StartTripRequest struct {
	UserID      string                 `json:"userId"`
	Metadata    map[string]interface{} `json:"metadata"`
	Source      string                 `json:"source,omitempty"`
	Destination string                 `json:"destination,omitempty"`
	Vehicle     *Vehicle               `json:"vehicle,omitempty"`
}

type StartTripResponse struct {
	Success   bool      `json:"success"`
	TripID    string    `json:"tripId"`
	StartTime time.Time `json:"startTime"`
}

type StopTripRequest struct {
	UserID string `json:"userId"`
	TripID string `json:"tripId"`
}

type StopTripResponse struct {
	Success bool  `json:"success"`
	Trip    *Trip `json:"trip"`
}

type UploadPointsRequest struct {
	UserID string     `json:"userId"`
	TripID string     `json:"tripId"`
	Points []GPSPoint `json:"points"`
}
