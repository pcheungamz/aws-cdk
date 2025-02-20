import { Function } from '../../aws-lambda';
import { BlockPublicAccess, Bucket, BucketProps } from '../../aws-s3';
import { Stack, Stage } from '../lib';
import { App } from '../lib/app';
import { applyInjectors, InjectionContext, IPropertyInjector, PropertyInjectors } from '../lib/prop-injectors';

describe('PropertyInjectors Attachment', () => {
  test('Attach PropertyInjectors to App', () => {
    // GIVEN
    const mock = jest.spyOn(PropertyInjectors.prototype, 'add').mockImplementation();

    // WHEN
    new App({
      propertyInjectors: [
        dnBucket,
        dnFunction,
      ],
    });

    // THEN
    expect(mock).toHaveBeenCalledWith(
      dnBucket,
      dnFunction,
    );

    mock.mockRestore();
  });

  test('Attach PropertyInjectors to Stage', () => {
    // GIVEN
    const mock = jest.spyOn(PropertyInjectors.prototype, 'add').mockImplementation();

    // WHEN
    const app = new App();
    new Stage(app, 'MyStage', {
      propertyInjectors: [dnBucket],
    });

    // THEN
    expect(mock).toHaveBeenCalledWith(dnBucket);

    mock.mockRestore();
  });

  test('Attach PropertyInjectors to Stake', () => {
    // GIVEN
    const mock = jest.spyOn(PropertyInjectors.prototype, 'add').mockImplementation();

    // WHEN
    const app = new App();
    const stage = new Stage(app, 'MyStage', {});
    new Stack(stage, 'MyStack', {
      propertyInjectors: [dnFunction],
    });

    // THEN
    expect(mock).toHaveBeenCalledWith(dnFunction);

    mock.mockRestore();
  });
});

describe('PropertyInjectors Tree Traversal', () => {
  test('PropertyInjectors use app over stack', () => {
    // GIVEN
    const app = new App({
      propertyInjectors: [dnBucket],
    });
    const stack = new Stack(app, 'MyStack', {
      propertyInjectors: [dnFunction],
    });
    const props: BucketProps = {
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
    };

    // WHEN
    const newProps = applyInjectors(Bucket.UNIQUE_FQN, props, {
      scope: stack,
      id: 'TestBucket',
    });

    // THEN
    expect(newProps).toEqual(props);
  });

  test('PropertyInjectors use stack over app', () => {
    // GIVEN
    const app = new App({
      propertyInjectors: [dnBucket],
    });
    const stack = new Stack(app, 'MyStack', {
      propertyInjectors: [bucketInjector],
    });
    const props: BucketProps = {
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
    };

    // WHEN
    const newProps = applyInjectors(Bucket.UNIQUE_FQN, props, {
      scope: stack,
      id: 'TestBucket',
    });

    // THEN
    expect(newProps).toEqual({
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
      enforceSSL: true,
    });
  });
});

describe('Bucket Injector', () => {
  test('Accept undefined from originalProp', () => {
    // GIVEN
    const app = new App({
      propertyInjectors: [bucketInjector],
    });
    const stack = new Stack(app, 'MyStack', {});
    const props: BucketProps = {
      blockPublicAccess: undefined,
    };

    // WHEN
    const newProps = applyInjectors(Bucket.UNIQUE_FQN, props, {
      scope: stack,
      id: 'TestBucket',
    });

    // THEN
    expect(newProps).toEqual({
      blockPublicAccess: undefined,
      enforceSSL: true,
    });
  });

  test('Use default values', () => {
    // GIVEN
    const app = new App({
      propertyInjectors: [bucketInjector],
    });
    const stack = new Stack(app, 'MyStack', {});
    const props: BucketProps = {};

    // WHEN
    const newProps = applyInjectors(Bucket.UNIQUE_FQN, props, {
      scope: stack,
      id: 'TestBucket',
    });

    // THEN
    expect(newProps).toEqual({
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
    });
  });
});

class DoNothingInjector implements IPropertyInjector {
  public readonly constructFqn: string;

  constructor(fqn: string) {
    this.constructFqn = fqn;
  }

  inject(originalProps: any, _context: InjectionContext): any {
    return originalProps;
  }
}

const dnBucket = new DoNothingInjector(Bucket.UNIQUE_FQN);
const dnFunction = new DoNothingInjector(Function.UNIQUE_FQN);

class MyBucketPropsInjector implements IPropertyInjector {
  public readonly constructFqn: string;

  constructor() {
    this.constructFqn = Bucket.UNIQUE_FQN;
  }

  inject(originalProps: any, _context: InjectionContext): any {
    const newProps = {
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      ...originalProps,
    };
    return newProps;
  }
}

const bucketInjector = new MyBucketPropsInjector();
