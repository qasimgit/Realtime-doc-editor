import React, { useCallback, useEffect, useRef, useState } from 'react'
import Quill from 'quill'
import "quill/dist/quill.snow.css"
import { io } from "socket.io-client"
import { useParams } from "react-router-dom"

const TextEditor = () => {
    const [socket, setSocket] = useState()
    const [quill, setQuill] = useState()

    const { id: documentId } = useParams()

    const TOOLBAR_OPTIONS = [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ font: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        ["bold", "italic", "underline"],
        [{ color: [] }, { background: [] }],
        [{ script: "sub" }, { script: "super" }],
        [{ align: [] }],
        ["image", "blockquote", "code-block"],
        ["clean"]
    ]

    // for user rooms 

    useEffect(() => {
        if (socket == null || quill == null) return

        socket.once("load-document", document => {
            quill.setContents(document)
            quill.enable()
        })

        // telling the server which document are we part of
        socket.emit("get-document", documentId)   // iut will sent the id to ther server to attach to these document



    }, [socket, quill, documentId])

    useEffect(() => {
        const so = io("http://localhost:4000")
        setSocket(so)
        return () => {
            so.disconnect()
        }

    }, [])

    useEffect(() => {
        /// only run when the socket or quill changes but not when they are undefined or null
        if (socket == null || quill == null) return
        const handler = (delta, oldDelta, source) => {   // source will check who made the changes
            if (source !== "user") return   // making sure only the changes made by user reflects
            socket.emit("send-changes", delta)
        }
        quill.on("text-change", handler)

        return () => {
            quill.off("text-change", handler)
        }

    }, [socket, quill])

    // useeffect for reciveing changes 
    // this will update the realtime content to every loaction where this url opens

    useEffect(() => {
        /// only run when the socket or quill changes but not when they are undefined or null
        if (socket == null || quill == null) return
        const handler = (delta) => {   // source will check who made the changes
            quill.updateContents(delta)
        }
        socket.on("receive-changes", handler)

        return () => {
            socket.off("receive-changes", handler)
        }

    }, [socket, quill])

    // useefect to save the document every couple of seconds

    useEffect(() => {
        if (socket == null || quill == null) return

        const interval = setInterval(() => {
            socket.emit("save-document", quill.getContents())

        }, 2000)

        return () => {
            clearInterval(interval)
        }

    }, [socket, quill])


    const wrapperRef = useCallback((wrapper) => {  // useeffect sometines throw ref indefined when it return thatswhy use callback()

        if (wrapper == null) return
        wrapper.innerHTML = ""
        const editor = document.createElement("div")

        wrapper.append(editor)
        const q = new Quill(editor, { theme: "snow", modules: { toolbar: TOOLBAR_OPTIONS } })
        q.disable()
        q.setText("Loading....")
        setQuill(q)
    }, [])

    return (
        <div className="container" ref={wrapperRef}>
            Text editor
        </div>
    )
}

export default TextEditor
