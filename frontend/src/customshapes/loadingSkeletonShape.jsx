// frontend/src/shapes/CustomWidgetShape.js
import * as React from 'react';
import { BaseBoxShapeUtil, HTMLContainer, stopEventPropagation } from 'tldraw';
import LoadingSkeleton from '../components/LoadingSkeleton';

// 1. Define the type for your custom shape
export const loadingShape = {
  type: 'loading-skeleton',
  props: {
    w: 800, 
    h: 800, 
  },
};

// 2. Create the Shape Utility Class
export class LoadingShapeUtil extends BaseBoxShapeUtil {
  static type = 'loading-skeleton';

  getDefaultProps() {
    return {
      w: 800,
      h: 800,
    };
  }

  // Define how the shape should be rendered.
  component(shape) {
    const { w, h } = shape.props;

    return (
      <HTMLContainer
        id={shape.id}
        style={{
          width: w,
          height: h,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '24px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        <LoadingSkeleton
          shapeId={shape.id}
          width={w}
          height={h}
          onPointerDown={stopEventPropagation} 
        />
      </HTMLContainer>
    );
  }

  indicator(shape) {
    // This draws the outline when the shape is selected or hovered
    return (
      <rect 
        width={shape.props.w} 
        height={shape.props.h} 
        rx="24" 
        ry="24"
        strokeWidth="2"
        stroke="#4ca1f1"
        fill="none"
      />
    );
  }
}