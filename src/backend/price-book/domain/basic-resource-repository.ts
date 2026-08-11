import { BasicResource } from './basic-resource';

export interface BasicResourceRepository {
    findById(id: string): Promise<BasicResource | null>;
    findByCode(code: string): Promise<BasicResource | null>;
    save(resource: BasicResource): Promise<void>;
    saveBatch(resources: BasicResource[]): Promise<void>;
}
