const {sqlForPartialUpdate} = require("./sql.js")

describe("Takes in data and returns formattedf for sql", function() {
    test("returns correct data", function() {
        const dataToUpdate = {"firstName":"value1", "lastName":"value2"}
        const jsToSql = {"firstName":"first_name","lastName":"last_name"}
        const {setCols,values} = sqlForPartialUpdate(dataToUpdate, jsToSql)
        expect(setCols).toEqual('"first_name"=$1, "last_name"=$2')
        expect(values).toEqual(["value1", "value2"])
    })
})