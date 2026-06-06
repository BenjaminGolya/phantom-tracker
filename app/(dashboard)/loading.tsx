import { PhantomLoader } from "@/components/brand/phantom-loader";

export default function Loading() {
  return (
    <div className="flex items-center justify-center py-32">
      <PhantomLoader label="Loading…" />
    </div>
  );
}
