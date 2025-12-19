package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"roady-server/db"
	"roady-server/models"

	"golang.org/x/crypto/bcrypt"
)

func SignUp(w http.ResponseWriter, r *http.Request) {
	var req models.SignUpRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	var user models.User
	err = db.DB.QueryRow(
		"INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id, email, username, created_at",
		req.Email, req.Username, string(hashedPassword),
	).Scan(&user.ID, &user.Email, &user.Username, &user.CreatedAt)

	if err != nil {
		json.NewEncoder(w).Encode(models.AuthResponse{Success: false, Error: "Email or username already exists"})
		return
	}

	// In a real app, generate a JWT here. For simplicity, we return the user ID as token.
	token := user.ID

	json.NewEncoder(w).Encode(models.AuthResponse{
		Success: true,
		User:    &user,
		Token:   token,
	})
}

func Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	var user models.User
	var passwordHash string

	err := db.DB.QueryRow(
		"SELECT id, email, username, created_at, password_hash FROM users WHERE email = $1 OR username = $1",
		req.EmailOrUsername,
	).Scan(&user.ID, &user.Email, &user.Username, &user.CreatedAt, &passwordHash)

	if err == sql.ErrNoRows {
		json.NewEncoder(w).Encode(models.AuthResponse{Success: false, Error: "Invalid credentials"})
		return
	} else if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		json.NewEncoder(w).Encode(models.AuthResponse{Success: false, Error: "Invalid credentials"})
		return
	}

	token := user.ID

	json.NewEncoder(w).Encode(models.AuthResponse{
		Success: true,
		User:    &user,
		Token:   token,
	})
}

func ValidateSession(w http.ResponseWriter, r *http.Request) {
	// Get token from Authorization header
	token := r.Header.Get("Authorization")
	if token == "" {
		http.Error(w, "Missing authorization token", http.StatusUnauthorized)
		return
	}

	// In this simple implementation, the token IS the user ID
	userID := token

	var user models.User
	err := db.DB.QueryRow(
		"SELECT id, email, username, created_at FROM users WHERE id = $1",
		userID,
	).Scan(&user.ID, &user.Email, &user.Username, &user.CreatedAt)

	if err == sql.ErrNoRows {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	} else if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(models.AuthResponse{
		Success: true,
		User:    &user,
		Token:   userID, // Return the same token/ID
	})
}

