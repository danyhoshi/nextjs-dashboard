'use server'; //Al agregar 'use server', marca todas las funciones exportadas dentro del archivo como funciones del servidor. Estas funciones del servidor se pueden importar luego a los componentes Cliente y Servidor, lo que los hace extremadamente versátiles.
import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
const FormSchema = z.object({
    id: z.string(),
    customerId: z.string(),
    amount: z.coerce.number(), //El amountcampo está configurado específicamente para forzar (cambiar) de una cadena a un número y al mismo tiempo validar su tipo.
    status: z.enum(['pending', 'paid']),
    date: z.string(),
  });
   
const CreateInvoice = FormSchema.omit({ id: true, date: true });
export async function createInvoice(formData: FormData) {
    // const rawFormData = {
    //     customerId: formData.get('customerId'),//Consejo: si está trabajando con formularios que tienen muchos campos, puede considerar usar elentries()  método con JavaScriptObject.fromEntries(). Por ejemplo:        const rawFormData = Object.fromEntries(formData.entries())
    //     amount: formData.get('amount'),
    //     status: formData.get('status'),
    //   };
      // Test it out:
    //   console.log(rawFormData);
    //   console.log(typeof rawFormData.amount);
    const { customerId, amount, status } = CreateInvoice.parse({
        customerId: formData.get('customerId'),
        amount: formData.get('amount'),
        status: formData.get('status'),
      });
      const amountInCents = amount * 100; //convirtiendo a centavos
      const date = new Date().toISOString().split('T')[0];

    await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `;
    revalidatePath('/dashboard/invoices'); //para borrar el caché de NextJs y activar una nueva solicitud al servidor Una vez que se haya actualizado la base de datos, /dashboard/invoicesse revalidará la ruta y se obtendrán datos nuevos del servidor.
    redirect('/dashboard/invoices'); //En este punto, también se desea redirigir al usuario a la /dashboard/invoices/
}