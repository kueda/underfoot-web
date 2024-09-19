import { UnderfootFeature } from '../../packs/types';

export default function WaterHeader({ feature }: { feature?: UnderfootFeature }) {
  return (
    <>
      <h3>
        {feature?.title || 'Unknown'}
      </h3>
      <div className="MapBottomSheetHeaderPreview">
        <div>it&apos;s water, ok?</div>
      </div>
    </>
  );
}
