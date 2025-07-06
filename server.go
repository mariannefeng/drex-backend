package main

import (
	"github.com/kataras/iris/v12"
	"github.com/mariannefeng/drex-backend/data"
)

func rootHandler(ctx iris.Context) {
	ctx.Header("Content-Type", "text/html")
	ctx.WriteString(`
	<html>
		<body>
			<p>drex-backend</p>
			<p>
				<a href="/api/queens">GET /api/queens</a>
			</p>
		</body>
	</html>
	`)
}

func listQueensHandler(ctx iris.Context) {
	ctx.Header("Content-Type", "application/json")
	ctx.Write(data.GetQueensBytes())
}

func getQueenHandler(ctx iris.Context) {
	id := ctx.Params().Get("id")
	queen, err := data.GetQueen(id)
	if err != nil {
		ctx.StopWithError(iris.StatusNotFound, err)
		return
	}
	ctx.JSON(queen)
}

func main() {
	app := iris.New()

	app.Get("/", rootHandler)
	app.Get("/api/queens", listQueensHandler)
	app.Get("/api/queens/{id:string}", getQueenHandler)

	app.Listen(":8080")
}
