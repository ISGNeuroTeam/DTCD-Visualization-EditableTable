// export function throttle(fn, limit = 250) {
//   let wait = false, result
//
//   return function (/* ...args */) {
//     if (wait === false) {
//       wait = true
//       setTimeout(() => { wait = false }, limit)
//       result = fn.apply(this, arguments)
//     }
//
//     return result
//   }
// }

export function throttle(func, ms) {
  let isThrottled = false;
  let savedArgs;
  let savedThis;

  function wrapper() {
    if (isThrottled) {
      // eslint-disable-next-line prefer-rest-params
      savedArgs = arguments;
      savedThis = this;
      return;
    }
    // eslint-disable-next-line prefer-rest-params
    func.apply(this, arguments);

    isThrottled = true;

    setTimeout(() => {
      isThrottled = false;
      if (savedArgs) {
        wrapper.apply(savedThis, savedArgs);
        savedArgs = null;
        savedThis = null;
      }
    }, ms);
  }

  return wrapper;
}
