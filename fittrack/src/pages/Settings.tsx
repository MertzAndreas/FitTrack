import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  useMeasurementSites,
  useTrackedMeasurements,
  useSetTrackedMeasurements,
} from "@/pages/Weight/use-weight-entries";

const Settings = () => {
  return (
    <div className="w-full flex flex-col gap-4 md:p-4 mx-auto max-w-6xl">
      <MeasurementsSettings />
    </div>
  );
};

const MeasurementsSettings = () => {
  const sitesQuery = useMeasurementSites();
  const trackedQuery = useTrackedMeasurements();
  const setTracked = useSetTrackedMeasurements();

  const tracked = trackedQuery.data ?? [];

  const toggle = (site: number, checked: boolean) => {
    const next = checked
      ? [...tracked, site].sort((a, b) => a - b)
      : tracked.filter((s) => s !== site);
    setTracked.mutate(next);
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>Measurements</CardTitle>
        <CardDescription>
          Choose which measurements to log with each weight entry. Existing
          entries keep the measurements they were saved with.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sitesQuery.isPending || trackedQuery.isPending ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !sitesQuery.data || !trackedQuery.data ? (
          <p className="text-sm text-muted-foreground">
            Could not load measurements.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-6">
            {sitesQuery.data.map((site) => (
              <div
                key={site.id}
                className="flex items-center justify-between gap-4"
              >
                <Label
                  htmlFor={`measurement-site-${site.id}`}
                  className="text-base font-normal tracking-normal normal-case"
                >
                  {site.name}
                </Label>
                <Switch
                  id={`measurement-site-${site.id}`}
                  checked={tracked.includes(site.id)}
                  onCheckedChange={(checked) => toggle(site.id, checked)}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Settings;
