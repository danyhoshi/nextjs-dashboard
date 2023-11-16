'use server'; //Al agregar 'use server', marca todas las funciones exportadas dentro del archivo como funciones del servidor. Estas funciones del servidor se pueden importar luego a los componentes Cliente y Servidor, lo que los hace extremadamente versátiles.
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer.',
      }), //Zod ya arroja un error si el campo del cliente está vacío porque espera un tipo string. Pero agreguemos un mensaje amigable si el usuario no selecciona un cliente.
    amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }), //Dado que está forzando el tipo de cantidad de stringa number, el valor predeterminado será cero si la cadena está vacía. Digámosle a Zod que siempre queremos la cantidad mayor que 0 con la .gt()función.
    status: z.enum(['pending', 'paid'], {
        invalid_type_error: 'Please select an invoice status.', //Zod ya arroja un error si el campo de estado está vacío porque espera "pendiente" o "pagado". También agreguemos un mensaje amigable si el usuario no selecciona un estado.
      }),
    date: z.string(),
  });
   
const CreateInvoice = FormSchema.omit({ id: true, date: true });
// This is temporary until @types/react-dom is updated
export type State = {
    errors?: {
      customerId?: string[];
      amount?: string[];
      status?: string[];
    };
    message?: string | null;
  };
   
  export async function createInvoice(prevState: State, formData: FormData) {
    // const rawFormData = {
    //     customerId: formData.get('customerId'),//Consejo: si está trabajando con formularios que tienen muchos campos, puede considerar usar elentries()  método con JavaScriptObject.fromEntries(). Por ejemplo:        const rawFormData = Object.fromEntries(formData.entries())
    //     amount: formData.get('amount'),
    //     status: formData.get('status'),
    //   };
      // Test it out:
    //   console.log(rawFormData);
    //   console.log(typeof rawFormData.amount);
    const validatedFields = CreateInvoice.safeParse({ //parse()Luego, cambie la función Zod a safeParse():
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
      });
       // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
  const { customerId, amount, status } = validatedFields.data;
      const amountInCents = amount * 100; //convirtiendo a centavos
      const date = new Date().toISOString().split('T')[0];

    // await sql`
    //     INSERT INTO invoices (customer_id, amount, status, date)
    //     VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    // `;

    //Manejando el error
    try {
        await sql`
          INSERT INTO invoices (customer_id, amount, status, date)
          VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `;
      } catch (error) {
        return {
          message: 'Database Error: Failed to Create Invoice.',
        };
      }
    revalidatePath('/dashboard/invoices'); //para borrar el caché de NextJs y activar una nueva solicitud al servidor Una vez que se haya actualizado la base de datos, /dashboard/invoicesse revalidará la ruta y se obtendrán datos nuevos del servidor.
    redirect('/dashboard/invoices'); //En este punto, también se desea redirigir al usuario a la /dashboard/invoices/
}

// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });
 
// ...
 
export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
 
  const amountInCents = amount * 100;
 
//   await sql`
//     UPDATE invoices
//     SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
//     WHERE id = ${id}
//   `;
try {
    await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
      `;
  } catch (error) {
    return { message: 'Database Error: Failed to Update Invoice.' };
  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices'); //Observe cómo redirect se llama fuera del try/catch bloque. Esto se debe a que redirect funciona arrojando un error, que el bloque detectaría catch. Para evitar esto, puedes llamar redirect después try/catch . redirectsólo sería accesible si trytiene éxito.
}

export async function deleteInvoice(id: string) {
    // await sql`DELETE FROM invoices WHERE id = ${id}`;
   // throw new Error('Failed to Delete Invoice');
    try {
        await sql`DELETE FROM invoices WHERE id = ${id}`;
        revalidatePath('/dashboard/invoices');
        return { message: 'Deleted Invoice.' };
      } catch (error) {
        return { message: 'Database Error: Failed to Delete Invoice.' };
      }
    
  }

  export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
  ) {
    try {
      await signIn('credentials', Object.fromEntries(formData));
    } catch (error) {
      if ((error as Error).message.includes('CredentialsSignin')) {
        return 'CredentialSignin';
      }
      throw error;
    }
  }