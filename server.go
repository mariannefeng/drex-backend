package main

import (
	"log"
	"net/http"
	"time"
)

func timeHandler(w http.ResponseWriter, r *http.Request) {
	tm := time.Now().Format(time.RFC1123)
	w.Write([]byte("The time is: " + tm))

}

func queensListHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte("[]"))
}

func main() {
	mux := http.NewServeMux()
	th := http.HandlerFunc(timeHandler)

	mux.Handle("/", th)
	mux.Handle("/queens", http.HandlerFunc(queensListHandler))
	log.Print("Listening on port 8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
