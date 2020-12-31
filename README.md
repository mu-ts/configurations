# Summary

Convenience around configurations.

## Usage

### Declare Sources

To return more than just your defaults, you will need to define the sources you want considered during a value lookup. The order or declaration, will determine the order they are queried in.

This example prioritizes secrets manager above all, then environment variables then a hard coded set of default values.

```
Configurations.store
  .secretManager('store-name', process.env.AWS_REGION)
  .environment()
  .defaults({"foo":"bar"})
```

### Use Values

To get raw values, you can use a simple get operation.

```
const myConfig: any = await Configurations.get('a-value');
```

To cast as the values are returned.

```
const myConfig: string = await Configurations.as.string('a-value');
```
