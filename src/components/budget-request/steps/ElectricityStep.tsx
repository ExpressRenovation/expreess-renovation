import { UseFormReturn, FieldArrayWithId } from 'react-hook-form';
import { DetailedFormValues } from '../schema';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { RadioGroup } from '@/components/ui/radio-group';
import { RadioCard } from '@/components/ui/radio-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Plug, ThermometerSnowflake, Fan, Wind } from 'lucide-react';

interface ElectricityStepProps {
  form: UseFormReturn<DetailedFormValues>;
  bedroomFields: FieldArrayWithId<DetailedFormValues, "electricalBedrooms", "id">[];
  t: any;
}

export const ElectricityStep = ({ form, t, bedroomFields }: ElectricityStepProps) => {
  const commonT = t.budgetRequest.form;
  const propertyType = form.watch('propertyType');
  const installAC = form.watch('installAirConditioning');

  return (
    <div className="space-y-8 text-left animate-in fade-in-50 duration-500">

      {/* SCOPE SELECTION */}
      <Card>
        <CardHeader><CardTitle className='text-lg flex items-center gap-2'><Zap className="text-yellow-500" /> {commonT.electricity.scope.label}</CardTitle></CardHeader>
        <CardContent className='space-y-6'>
          <FormField
            control={form.control}
            name="elecScope"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <RadioCard
                      value="total"
                      label={commonT.electricity.scope.total}
                      description={commonT.electricity.scope.totalDesc}
                      icon={<Zap className="w-5 h-5 text-yellow-500" />}
                    />
                    <RadioCard
                      value="partial"
                      label={commonT.electricity.scope.partial}
                      description={commonT.electricity.scope.partialDesc}
                      icon={<Plug className="w-5 h-5" />}
                    />
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* DETAILED ROOMS */}
      {propertyType === 'residential' && (
        <>
          <Card>
            <CardHeader><CardTitle className='text-lg'>{commonT.electricity.perRoom.kitchen}</CardTitle></CardHeader>
            <CardContent className='space-y-4'>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="electricalKitchen.sockets"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{commonT.electricity.perRoom.sockets}</FormLabel>
                      <FormControl><Input type="number" placeholder="8" {...field} value={field.value || ''} /></FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="electricalKitchen.lights"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{commonT.electricity.perRoom.lights}</FormLabel>
                      <FormControl><Input type="number" placeholder="3" {...field} value={field.value || ''} /></FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {bedroomFields.map((field, index) => (
            <Card key={field.id}>
              <CardHeader><CardTitle className='text-lg'>{commonT.electricity.perRoom.bedroom} {index + 1}</CardTitle></CardHeader>
              <CardContent className='space-y-4'>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`electricalBedrooms.${index}.sockets`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{commonT.electricity.perRoom.sockets}</FormLabel>
                        <FormControl><Input type="number" placeholder="4" {...field} value={field.value || ''} /></FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`electricalBedrooms.${index}.lights`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{commonT.electricity.perRoom.lights}</FormLabel>
                        <FormControl><Input type="number" placeholder="2" {...field} value={field.value || ''} /></FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}

      {/* CLIMATE CONTROL */}
      <Card className="border-blue-200 bg-blue-50/20">
        <CardHeader><CardTitle className='text-lg flex items-center gap-2'><ThermometerSnowflake className="text-blue-500" /> {commonT.electricity.ac.label}</CardTitle></CardHeader>
        <CardContent className='space-y-4'>
          <FormField
            control={form.control}
            name="installAirConditioning"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-white">
                <FormLabel className="text-base">{commonT.electricity.ac.installLabel}</FormLabel>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )}
          />

          {installAC && (
            <div className="space-y-6 pt-4 animate-in slide-in-from-top-4">
              <FormField
                control={form.control}
                name="hvacType"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel className="font-semibold">{commonT.electricity.ac.typeLabel}</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      >
                        <RadioCard
                          value="split"
                          label={commonT.electricity.ac.split}
                          description={commonT.electricity.ac.splitDesc}
                          icon={<Fan className="w-5 h-5" />}
                        />
                        <RadioCard
                          value="ducts"
                          label={commonT.electricity.ac.ducts}
                          description={commonT.electricity.ac.ductsDesc}
                          icon={<Wind className="w-5 h-5" />}
                        />
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hvacCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{commonT.electricity.ac.countLabel}</FormLabel>
                    <FormControl><Input type="number" placeholder="Ej: 3" className="max-w-[150px] bg-white" {...field} value={field.value || ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};
