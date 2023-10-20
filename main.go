package main

import (
	"syscall/js"

	"github.com/valyala/fastjson"
)

func validateJson(this js.Value, args []js.Value) interface{} {
	file := args[0]
	fileReader := js.Global().Get("FileReaderSync").New()
	content := fileReader.Call("readAsText", file).String()

	err := fastjson.Validate(content)
	if err != nil {
		return false
	}

	return true
}

func main() {
	js.Global().Set("validateJson", js.FuncOf(validateJson))

	<-make(chan struct{}, 0)
}
