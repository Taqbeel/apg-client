
export async function pageRoute(index, router) {
  const key = index.key
  switch (key) {
    case '1':
      router.push("/dashboard")
      break;
    case '2':
      router.push("/dashboard/orders")
      break;
    case '3':
      router.push("/dashboard/inventory")
      break;
    default:
      break;
  }
}