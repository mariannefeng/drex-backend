package data

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"log"
)

type Queen struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	ProfileLink string `json:"profileLink"`
	Looks       []Look `json:"looks"`
}

type Look struct {
	Caption  string `json:"caption"`
	ImageURL string `json:"image_url"`
	Season   Season `json:"season"`
}

type Season struct {
	Show   string `json:"show"`
	Season int    `json:"season"`
}

var (
	// eventually this data should probably be fetched from a database or blob storage
	//go:embed queens.json
	queensData []byte

	Queens []Queen
)

func init() {
	err := json.Unmarshal(queensData, &Queens)
	if err != nil {
		log.Fatal(err)
	}
}

func GetQueen(id string) (*Queen, error) {
	for _, queen := range Queens {
		if queen.ID == id {
			return &queen, nil
		}
	}
	return nil, fmt.Errorf("queen with id %s not found", id)
}
