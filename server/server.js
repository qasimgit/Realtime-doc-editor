const mongoose = require('mongoose')
const Document = require('./Document')

mongoose.connect('mongodb://localhost/google-docs-clone', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
})

const io = require("socket.io")(4000, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ["GET", "POST"]
    },
})

io.on("connection", socket => {
    socket.on("get-document", async documentId => {
        const document = await findDocumentOrCreateDoc(documentId)
        socket.join(documentId)
        socket.emit("load-document", document?.data)

        socket.on("send-changes", delta => {
            socket.broadcast.to(documentId).emit("receive-changes", delta)
        })

        // save the document
        socket.on("save-document", async data => {
            Document.findByIdAndUpdate(documentId, { data })

        })

    })

    console.log("connected")
})

const defaultvalue = ""

// this will bring the docuemtn if exist otherwise will create it

const findDocumentOrCreateDoc = async (id) => {
    if (id == null) return
    const document = await Document.findById(id)
    if (document) return document
    return Document.create({ _id: id, data: defaultValue })
}