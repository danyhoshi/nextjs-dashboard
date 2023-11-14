'use client'; //This is a Client Component, which means you can use event listeners and hooks.

import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useDebouncedCallback } from 'use-debounce';

export default function Search({ placeholder }: { placeholder: string }) {
  const searchParams = useSearchParams();//Allows you to access the parameters of the current URL. For example, the search params for this URL /dashboard/invoices?page=1&query=pending would look like this: {page: '1', query: 'pending'}.
  const pathname = usePathname(); // is the current path. Lets you read the current URL's pathname. For example, the route /dashboard/invoices, usePathname would return '/dashboard/invoices'
  const { replace } = useRouter(); // Enables navigation between routes within client components programmatically. There are multiple methods you can use.

  const handleSearch = useDebouncedCallback((term) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    console.log(`Searching page... ${params.get('page')}`);
    if (term) {
      params.set('query', term);
      console.log(`Searching query... ${params.get('query')}`);
    } else {
      params.delete('query');
    }
    replace(`${pathname}?${params.toString()}`);//command updates the URL with the user's search data. For example, /dashboard/invoices?query=lee 
  }, 300);//wait 3 seconds in execute 
  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
        placeholder={placeholder}
        onChange={(e) => {
          handleSearch(e.target.value);
        }}
        defaultValue={searchParams.get('query')?.toString()} //defaultValue. This means the native input will manage its own state. This is okay since you're saving the search query to the URL instead of state. (con solo React se usa value y se maneja con el estado)
      />
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
    </div>
  );
}
