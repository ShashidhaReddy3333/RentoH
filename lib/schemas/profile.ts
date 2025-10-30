import { z } from "zod";

export const userType = z.enum(["tenant", "landlord", "both"]);
export const contactMethod = z.enum(["email", "phone", "chat"]);

export const signUpSchema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, "Enter your name")
      .max(80, "Keep your name under 80 characters")
      .optional(),
    email: z
      .string()
      .trim()
      .email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Use at least 8 characters")
      .max(72, "Password must be under 72 characters"),
    confirm_password: z.string().min(8, "Confirm your password"),
    role: z.enum(["tenant", "landlord"], {
      errorMap: () => ({ message: "Choose an account type" })
    })
  })
  .refine((value) => value.password === value.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"]
  });

export type SignUpInput = z.infer<typeof signUpSchema>;

export const profileUpdateSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Enter your name")
    .max(80, "Keep your name under 80 characters")
    .optional(),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .optional(),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(20, "Phone number is too long")
    .optional(),
  user_type: userType.optional(),
  city: z.string().trim().max(120).optional(),
  address: z.string().trim().max(200).optional(),
  contact_method: contactMethod.optional(),
  dob: z.string().optional(),
  photo: z.any().optional()
});
