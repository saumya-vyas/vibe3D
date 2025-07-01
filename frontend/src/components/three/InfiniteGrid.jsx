import {Grid} from "@react-three/drei";

const InfiniteGrid = ({isSky}) => {
    return (
        <Grid
            args={[30, 30]}
            cellThickness={1}
            cellColor={isSky ? "#6f6f6f" : "#000000"}
            sectionSize={5}
            sectionThickness={1.3}
            sectionColor="#6f6f6f"
            fadeDistance={100}
            fadeStrength={0.8}
            infiniteGrid
            followCamera={false}
        />
    )
}

export default InfiniteGrid