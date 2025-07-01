import { Spinner } from "@chakra-ui/react"

const LoadingSkeleton = ({ width, height }) => (
  <div style={{
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f4f8',
    borderRadius: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
  }}>
    <Spinner 
      color="blue.500" 
      borderWidth="4px" 
      size="xl"
      thickness="4px"
      speed="0.8s"
    />
  </div>
)

export default LoadingSkeleton
