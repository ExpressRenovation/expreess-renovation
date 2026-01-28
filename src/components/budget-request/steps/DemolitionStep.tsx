import { UseFormReturn } from 'react-hook-form';
import { DetailedFormValues } from '../schema';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface DemolitionStepProps {
  form: UseFormReturn<DetailedFormValues>;
  t: any;
}

export const DemolitionStep = ({ form, t }: DemolitionStepProps) => {
  const watchDemolishPartitions = form.watch('demolishPartitions');
  const watchRemoveDoors = form.watch('removeDoors');
  const commonT = t.budgetRequest.form;

  // Translation from dictionary
  const commonDemolition = commonT.demolition;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="hasElevator"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/20">
              <FormLabel className="text-base font-medium">{commonDemolition.elevator}</FormLabel>
              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="furnitureRemoval"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-muted/20">
              <FormLabel className="text-base font-medium">{commonDemolition.furniture}</FormLabel>
              <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            </FormItem>
          )}
        />
      </div>

      <div className="border-t pt-4 space-y-4">
        <h3 className="text-lg font-semibold">{commonDemolition.demolishPartitions.label}</h3>

        <FormField
          control={form.control}
          name="demolishPartitions"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 text-left">
              <div className="space-y-0.5">
                <FormLabel className="text-base">{commonDemolition.demolishPartitions.label}</FormLabel>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        {watchDemolishPartitions && (
          <div className="pl-4 border-l-2 border-primary space-y-4">
            <FormField
              control={form.control}
              name="demolishPartitionsM2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{commonDemolition.demolishPartitionsM2.label}</FormLabel>
                  <FormControl><Input type="number" placeholder="25" {...field} value={field.value || ''} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="wallThickness"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>{commonDemolition.thickWall.label}</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="thin" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {commonDemolition.thickWall.thin}
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="thick" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {commonDemolition.thickWall.thick}
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="removeDoors"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 text-left">
              <div className="space-y-0.5">
                <FormLabel className="text-base">{commonDemolition.removeDoors.label}</FormLabel>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        {watchRemoveDoors && (
          <FormField
            control={form.control}
            name="removeDoorsAmount"
            render={({ field }) => (
              <FormItem className="pl-4 border-l-2 border-primary">
                <FormLabel>{commonDemolition.removeDoorsAmount.label}</FormLabel>
                <FormControl><Input type="number" placeholder="5" {...field} value={field.value || ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>

      <div className="border-t pt-4 space-y-4">
        <h3 className="text-lg font-semibold">{commonDemolition.demolishPartitions.label}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="demolishFloorsM2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{commonDemolition.floors}</FormLabel>
                <FormControl><Input type="number" placeholder="Ej: 80" {...field} value={field.value || ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="demolishWallTilesM2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{commonDemolition.wallTiles}</FormLabel>
                <FormControl><Input type="number" placeholder="Ej: 30 (Baños/Cocina)" {...field} value={field.value || ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
};
