/**
 * Internal helper to create the proxy object
 * It lifes as standalone function because we dont need to carrie it in memory for every ActionHandler instance
 * @param subjects
 * @param transforms
 */
import { Subject } from 'rxjs';
import { KeysOf, ValuesOf } from '../../utils/src';
import { RxActions } from './types';

export function actionProxyHandler<T, U>(
  subjects: { [K in keyof T]: Subject<ValuesOf<T>> },
  transforms?: U
): ProxyHandler<RxActions<T, U>> {
  return {
    get(_, property: string) {
      type KeysOfT = KeysOf<T>;
      type ValuesOfT = ValuesOf<T>;

      const prop = property as KeysOfT;

      // the user wants to get a observable
      if (prop.toString().split('').pop() === '$') {
        const propName = prop.toString().slice(0, -1) as KeysOfT;
        subjects[propName] = subjects[propName] || new Subject<ValuesOfT>();
        return subjects[propName];
      }

      // the user wants to get a dispatcher function
      return (args: ValuesOfT) => {
        subjects[prop] = subjects[prop] || new Subject<ValuesOfT>();
        const val = transforms && (transforms as any)[prop] ? (transforms as any)[prop](args) : args
        subjects[prop].next(val);
      };
    },
    set() {
      throw new Error('No setters available. To emit call the property name.');
    },
  };
}
