
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useStore} from '../../store/useStore'
import Experience from "./Experience";
import {Leva} from 'leva'

export default function Scene() {
    const {is2D} = useStore()
    
    return (
        <div style={{ width: '100%', height: '100%', display: is2D ? 'none' : 'block', }}>
            <Leva hidden={is2D}/>
            <Canvas
                gl={{ antialias: false}}
                camera={{ position: [0, 5, 20], fov: 40 }}
                shadows
                style={{ width: '100%', height: '100%' }}
            >
                <OrbitControls
                    makeDefault
                    minPolarAngle={0}
                    maxPolarAngle={Math.PI / 2.1}
                    minDistance={5}
                    maxDistance={50}
                    enableDamping
                    dampingFactor={0.05}
                />

                <ambientLight intensity={1} /> 
                <directionalLight
                    position={[25, 9, -15]} 
                    intensity={1.5} 
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                    shadow-bias={-0.0001} 
                />

                <Experience/>
                
            </Canvas>

        </div>
    )
}