const showPopup = (message, duration = 2000, button, popupRef) => {
    if (popupRef.current) {
        popupRef.current.textContent = message
        const buttonRect = button.getBoundingClientRect()
        popupRef.current.style.left = `${buttonRect.left + buttonRect.width/2}px`
        popupRef.current.style.top = `${buttonRect.bottom + 10}px`
        popupRef.current.style.transform = 'translateX(-50%)'
        popupRef.current.style.opacity = '1'
        
        setTimeout(() => {
        popupRef.current.style.opacity = '0'
        }, duration)
    }
}

  export default showPopup