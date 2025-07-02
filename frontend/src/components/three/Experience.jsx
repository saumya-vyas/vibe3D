import InfiniteGrid from "./InfiniteGrid";
import { StoredObjects } from "./StoredObjects";
import {  Sky as SkyComponent, Stars as StarComponenet } from "@react-three/drei";
import {useControls, Leva} from 'leva'
import { MeshCreator } from "./MeshCreator";
import { useFrame } from "@react-three/fiber";
import { useRef, useState } from "react";



export default function Experience() {
    const {Sky, Stars, Plane, PlaneColor, RotateView} = useControls({
        Sky: { value: false },
        Stars : { value : false},
        Plane: { value : false},
        PlaneColor : { value : '#ffffff'},
        RotateView : { value : false},
    })

    const [sceneRotation, setSceneRotation] = useState(0);
    const groupRef = useRef();

    useFrame(() => {
        if (RotateView && groupRef.current) {
            setSceneRotation(rot => rot + 0.002);
        }
        if (groupRef.current) {
            groupRef.current.rotation.y = sceneRotation;
        }
    });

    return (
        <>
            
            {/* <Leva /> */}
            <group ref={groupRef}>
                <ambientLight intensity={1} /> 
                <directionalLight
                    position={[25, 9, -15]} 
                    intensity={1.5} 
                    castShadow
                    shadow-mapSize-width={2048}
                    shadow-mapSize-height={2048}
                    shadow-bias={-0.0001} 
                />
                {Plane ? (
                    <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                        <planeGeometry args={[500, 500]} />
                        <meshStandardMaterial color={PlaneColor} />
                    </mesh>
                ) : (
                    <InfiniteGrid isSky={Sky}/>
                )}

                {Sky && (
                    <SkyComponent 
                        distance={450000} 
                        sunPosition={[5, 1, 2]} 
                        inclination={0.1} 
                        azimuth={0.5} 
                        rayleigh={0.5}
                        turbidity={10}
                        mieCoefficient={0.005}
                        mieDirectionalG={0.8}
                    />
                    
                )}

                {Stars && (  
                    <StarComponenet radius={50} depth={10} count={5000} factor={4} saturation={0} fade speed={1} />
                )}

                <StoredObjects />
                <MeshCreator />
            </group>
        </>
    )
}