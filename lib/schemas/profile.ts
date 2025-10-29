import { z } from "zod";

export const userType = z.enum(["tenant", "landlord", "both"]);
export const contactMethod = z.enum(["email", "phone", "chat"]);

export const signUpSchema = z.object({
  full_name: z.string().min(2, "Enter your real name"),
  email: z.string().email(),
  password: z.string().min(8, "Min 8 characters"),
  phone: z.string().min(7, "Enter a valid phone"),
  user_type: userType,
  city: z.string().optional(),
  address: z.string().optional(),
  contact_method: contactMethod.optional(),
  dob: z.string().optional(), // ISO date
  photo: z.any().optional() // File | null, validated in runtime
});

export type SignUpInput = z.infer<typeof signUpSchema>;

export const profileUpdateSchema = signUpSchema
  .omit({ password: true, email: true }) // email not editable here
  .extend({
    email: z.string().email().optional()
  });
