import axios from "axios"
import FormData from "form-data"
import fs from "fs"

export async function sendToYolo(imagePath) {
  const form = new FormData()
  form.append("file", fs.createReadStream(imagePath))

  const response = await axios.post(
    "http://localhost:8000/detect",
    form,
    {
      headers: form.getHeaders(),
      timeout: 15000,
    }
  )

  return response.data
}
