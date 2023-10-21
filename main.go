package main

import (
	"syscall/js"

	"github.com/valyala/fastjson"
)

func validateJson(this js.Value, args []js.Value) interface{} {
	err := fastjson.Validate(args[0].String())
	if err != nil {
		return false
	}

	return true
}

func main() {
	js.Global().Set("validateJson", js.FuncOf(validateJson))

	<-make(chan struct{}, 0)
}
