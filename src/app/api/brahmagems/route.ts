import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Step 1: first page
    const firstRes = await fetch(
      `https://api.brahmagems.com/gemstones/products?page=1`,
      { headers: { Accept: "application/json" } }
    );

    const firstData = await firstRes.json();

    let allProducts = [...(firstData?.data?.products || [])];
    const totalPages = firstData?.data?.total_pages || 1;

    console.log("Total pages:", totalPages);

    // 🔥 batch size (IMPORTANT)
    const BATCH_SIZE = 10;

    for (let i = 2; i <= totalPages; i += BATCH_SIZE) {
      const batch = [];

      for (let j = i; j < i + BATCH_SIZE && j <= totalPages; j++) {
        batch.push(
          fetch(
            `https://api.brahmagems.com/gemstones/products?page=${j}`,
            { headers: { Accept: "application/json" } }
          ).then(res => res.json())
        );
      }

      const results = await Promise.all(batch);

      results.forEach((data) => {
        allProducts.push(...(data?.data?.products || []));
      });

      console.log(`Done pages ${i} → ${i + BATCH_SIZE - 1}`);
    }

    return NextResponse.json({
      count: allProducts.length,
      products: allProducts,
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "fail" }, { status: 500 });
  }
}



// //correct
// import { NextRequest, NextResponse } from "next/server";

// export async function GET(request: NextRequest) {
//   const searchParams = request.nextUrl.searchParams;
//   const page = searchParams.get("page") || "1";

  
 
//   try {
//     const response = await fetch(
//   `https://api.brahmagems.com/gemstones/products?page=${page}`,
//   {
//     headers: {
//       Accept: "application/json",
//     },
//     cache: "no-store",
//   }
// );

//     if (!response.ok) {
//       throw new Error(`BrahmaGems API failed: ${response.status}`);
//     }

//     const data = await response.json();

//     return NextResponse.json({
//       products: data?.data?.products ?? [],
//       total_pages: data?.data?.total_pages ?? 0,
//       current_page: data?.data?.current_page ?? Number(page),
//     });
//   } catch (error) {
//     console.error("Error fetching BrahmaGems products:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch BrahmaGems products" },
//       { status: 500 }
//     );
//   }
// }

