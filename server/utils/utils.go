package utils

import (
	"math/rand"
	"time"
)

const (
	ALPHABET = "ABCDEFGHJKLMPQRSTUVWXYZ123456789"
	N        = len(ALPHABET)
)

func init() {
	rand.Seed(time.Now().UTC().UnixNano())
}

func RandomString(length int) string {
	res := make([]byte, length)
	for i := 0; i < length; i++ {
		res[i] = ALPHABET[rand.Intn(N)]
	}
	return string(res)
}
