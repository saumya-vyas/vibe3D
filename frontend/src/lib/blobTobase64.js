export function blobToBase64(blob){
	return new Promise((resolve, _) => {
		const reader = new FileReader()
		reader.onloadend = () => {
			const result = reader.result 
			const base64Content = result.split(',')[1]
			resolve(base64Content)
		}
		reader.readAsDataURL(blob)
	})
}
