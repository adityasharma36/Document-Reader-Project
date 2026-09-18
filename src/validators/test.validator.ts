
import * as z from 'zod';

 export const testSchema = z.object({
    name:z.string("must be more than 6 char")
})

export type testDto = z.infer<typeof testSchema>;