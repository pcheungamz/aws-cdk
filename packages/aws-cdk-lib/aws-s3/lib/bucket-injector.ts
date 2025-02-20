import { log } from 'console';
import { inspect } from 'util';
import { BlockPublicAccess, Bucket } from './bucket';
import { InjectionContext, IPropertyInjector } from '../../core/lib/prop-injectors';

/**
 * An IPropertyInjector that does not change the originalProps.
 */
export class DoNothingInjector implements IPropertyInjector {
  public readonly constructFqn: string;

  constructor(fqn: string) {
    this.constructFqn = fqn;
  }

  inject(originalProps: any, _context: InjectionContext): any {
    return originalProps;
  }
}

/**
 * An IPropertyInjector that blocks public access.
 */
export class MyBucketPropsInjector implements IPropertyInjector {
  public readonly constructFqn: string;

  constructor() {
    this.constructFqn = Bucket.UNIQUE_FQN;
  }

  inject(originalProps: any, _context: InjectionContext): any {
    log(`orig: ${inspect(originalProps)}`);
    const newProps = {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      ...originalProps,
    };
    log(`new: ${inspect(newProps)}`);
    return newProps;
  }
}
