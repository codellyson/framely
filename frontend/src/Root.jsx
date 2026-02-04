import { Composition } from './lib/Composition';
import { Folder } from './lib/Folder';
import SampleVideo from './compositions/SampleVideo';
import TransitionsTest from './compositions/TransitionsTest';
import LoopTest from './compositions/LoopTest';
import SeriesTest from './compositions/SeriesTest';
import AnimationsTest from './compositions/AnimationsTest';
import ColorInterpolationTest from './compositions/ColorInterpolationTest';

export function Root() {
  return (
    <>
      <Composition
        id="sample-video"
        component={SampleVideo}
        width={1920}
        height={1080}
        fps={30}
        durationInFrames={300}
        defaultProps={{}}
      />
      <Folder name="Tests">
        <Composition
          id="transitions-test"
          component={TransitionsTest}
          width={1920}
          height={1080}
          fps={30}
          durationInFrames={280}
          defaultProps={{}}
        />
        <Composition
          id="loop-test"
          component={LoopTest}
          width={1920}
          height={1080}
          fps={30}
          durationInFrames={300}
          defaultProps={{}}
        />
        <Composition
          id="series-test"
          component={SeriesTest}
          width={1920}
          height={1080}
          fps={30}
          durationInFrames={210}
          defaultProps={{}}
        />
        <Composition
          id="animations-test"
          component={AnimationsTest}
          width={1920}
          height={1080}
          fps={30}
          durationInFrames={120}
          defaultProps={{}}
        />
        <Composition
          id="color-test"
          component={ColorInterpolationTest}
          width={1920}
          height={1080}
          fps={30}
          durationInFrames={150}
          defaultProps={{}}
        />
      </Folder>
    </>
  );
}
