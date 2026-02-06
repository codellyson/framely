import { Composition } from '@codellyson/framely';
import { HelloWorld } from './compositions/HelloWorld';

export function Root() {
  return (
    <>
      <Composition
        id="hello-world"
        component={HelloWorld}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={150}
        defaultProps={{}}
      />
    </>
  );
}
