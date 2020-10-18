const FindResourcePlugin = require("../src/index.js")
describe("Constructor", () => {
    it("should not fail", async () => {
        const plugin = new FindResourcePlugin({
            providers: {
                aws: {}
            }
        })
    })
})

describe("Plugin", () => {
    it("should not fail when no handler is found for resource", async () => {
        const plugin = new FindResourcePlugin({
            providers: {
                aws: {}
            }
        })
        plugin.handleVariable("asdfasdfasfaddfasf:george")
    })
})