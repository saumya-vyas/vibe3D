import { useStore } from '../store/useStore'
import './Canvas.css'

export default function Toggle2D3D(){
    const {is2D, setIs2D} = useStore()

    const handleClick = () => {
        setIs2D(!is2D)  
    }
    return(
        <button onClick={handleClick} className="enhance-button-3d" style={{ right: is2D ? "140px" : "280px", backgroundColor: "#292d39", border : is2D ? "1px solid #000000" : "1px solid #ffffff" }}>
            {is2D ? "3D" : "2D"}
        </button>
    )
}