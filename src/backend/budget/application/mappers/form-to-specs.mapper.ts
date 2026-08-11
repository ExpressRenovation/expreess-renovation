import { DetailedFormValues } from '@/components/budget-request/schema';
import { ProjectSpecs, RoomSpecs, BathroomSpecs, KitchenSpecs } from '@/backend/budget/domain/project-specs';

export class FormToSpecsMapper {
    static map(form: DetailedFormValues): ProjectSpecs {
        const rooms: RoomSpecs[] = [];
        // Map bedrooms if available in form logic - currently form has aggregations like 'numberOfRooms'
        // Ideally we'd iterate if we had detailed room data, but basic mapping:
        if (form.numberOfRooms) {
            // Simplified: we don't have per-room dimensions in the basic form, just total count
            // We might default or leave empty. Let's create placeholders.
            for (let i = 0; i < (form.numberOfRooms || 0); i++) {
                rooms.push({ area: 12 }); // Default 12m2 assumption if unknown
            }
        }

        const bathrooms: BathroomSpecs[] = [];
        if (form.bathrooms) {
            form.bathrooms.forEach(b => {
                bathrooms.push({
                    area: (b.floorM2 || 4), // Default 4m2
                    hasShower: b.installShowerTray,
                    quality: b.quality as 'basic' | 'medium' | 'premium' || 'medium'
                });
            });
        }

        const kitchens: KitchenSpecs[] = [];
        if (form.kitchen?.renovate) {
            kitchens.push({
                area: (form.kitchen.floorM2 || 10),
                quality: form.kitchen.quality as 'basic' | 'medium' | 'premium' || 'medium'
            });
        }

        return {
            propertyType: form.propertyType as 'flat' | 'house' | 'office' || 'flat',
            interventionType: form.projectScope === 'integral' ? 'total' : 'partial',
            totalArea: form.totalAreaM2 || 0,
            qualityLevel: 'medium', // Default as it's not in the root schema

            demolition: !!(form.demolishPartitions || form.demolishFloorsM2),
            elevator: !!form.hasElevator,
            parking: false, // Not in current form

            rooms,
            bathrooms,
            kitchens
        };
    }
}
