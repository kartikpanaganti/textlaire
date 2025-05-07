// This is a simple workaround to fix the emotion dependency issues
// It provides the missing default export for hoist-non-react-statics
import * as hoistNonReactStatics from 'hoist-non-react-statics';

// Export a proper default and named exports
export default hoistNonReactStatics;
export const hoistStatics = hoistNonReactStatics.default || hoistNonReactStatics;

// Re-export any other named exports
export * from 'hoist-non-react-statics';
