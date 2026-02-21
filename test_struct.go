package main

import (
	"encoding/json"
	"fmt"
)

type Payment struct {
	ID     string  `json:"id"`
	UserID string  `json:"user_id"`
	MessID string  `json:"mess_id"`
	Amount float64 `json:"amount"`
}

func main() {
	jsonStr := `{"user_id": "USER-123", "amount": 500}`
	var p Payment
	err := json.Unmarshal([]byte(jsonStr), &p)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	fmt.Printf("UserID: '%s'\n", p.UserID)
	if p.UserID == "USER-123" {
		fmt.Println("SUCCESS: UserID parsed correctly")
	} else {
		fmt.Println("FAILURE: UserID NOT parsed")
	}
}
