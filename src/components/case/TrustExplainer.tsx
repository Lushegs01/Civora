import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

export function TrustExplainer({ className }: { className?: string }) {
  return (
    <div className={cn("card overflow-hidden", className)}>
      <div className="bg-brand-soft/30 px-5 py-4 border-b border-line">
        <h3 className="flex items-center gap-2 text-[14px] font-semibold text-brand-deep">
          <Icon name="shield-check" className="h-4 w-4" />
          How we build trust
        </h3>
        <p className="mt-1 text-[13px] text-ink-soft">
          Civora separates what is reported from what is verified.
        </p>
      </div>
      <div className="px-5 py-5 space-y-4">
        <div className="flex gap-3">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-ink-soft">
            <span className="text-[11px] font-bold">1</span>
          </div>
          <div>
            <p className="text-[13.5px] font-medium text-ink">Incident Reported</p>
            <p className="text-[13px] text-ink-soft">
              Community members report issues safely. Unverified reports are marked clearly.
            </p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700">
            <span className="text-[11px] font-bold">2</span>
          </div>
          <div>
            <p className="text-[13.5px] font-medium text-ink">Corroborated</p>
            <p className="text-[13px] text-ink-soft">
              Multiple independent reports or photo evidence confirm the issue exists.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success-soft text-success">
            <span className="text-[11px] font-bold">3</span>
          </div>
          <div>
            <p className="text-[13.5px] font-medium text-ink">Officially Verified</p>
            <p className="text-[13px] text-ink-soft">
              An authorized responder or trusted partner organization confirms the details.
            </p>
          </div>
        </div>
        
        <div className="mt-2 pt-4 border-t border-line text-[12.5px] text-ink-soft">
          <strong>Note:</strong> A case can be verified even if it hasn't been fixed yet. 
          We never silently close a case without documenting the resolution.
        </div>
      </div>
    </div>
  );
}
