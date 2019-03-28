# Summary

Wrapper around Secrets Manager and process.env to lookup configuration values. Secrets manager is the preferred source so it will override all other configuration values.

# Usage

For the secret name, its wise to come up with a strategy around a 'stage' so that your configurations for each logical deployment are isolated. You should also bundle your secrets pre logical system, micro-service or unit of work. Per function is likely a bit to granular to be handy.

Example name assuming the stage is 'dev': `/dev/users-service`

Within the body of the secrets is expected to be JSON. You can have nested objects and it will mostly work, but this is not thoroughly tested.

```
import { Configurations } from '@mu-ts/configuration';

const configurations: Configurations = new Conigurations('secretmaanager/store/name');

const aValue:  any | undefined = await configurations.get('AValue','fallback-default');

/* All non true statements evaluate to false, including no value being found. */
const aBoolean: boolean = configurations.getAsBoolean('AnotherValue',false);

const aString: string | undefined = await configurations.getAsString('SomeString','SomeDefault');

const aNumber: number | undefined = await configurations.getAsNumber('someNumber',100);
```
