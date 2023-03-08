export function setHandler(render: () => void) {
  return {
    get(target, prop, receiver) {
      const value = target[prop];
      if (!value instanceof Function) {
        return value;
      }

      return function (...args) {
        const result = value.apply(this === receiver ? target : this, args);
        if (prop === 'add' || prop === 'delete' || prop === 'clear') {
          console.log('Mutation, re-render');
          render();
        }
        return result;
      };
    },
  };
}
