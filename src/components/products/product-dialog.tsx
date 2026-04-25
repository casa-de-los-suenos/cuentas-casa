"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Controller,
  FormProvider,
  useFieldArray,
  useForm,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { NumericFormat } from "react-number-format";
import { useProductDialog } from "@/providers/products/dialog";
import { ProductCreateInput } from "@/domains/products/types";
import { organizationEnumValues } from "@/domains/products/models";
import { ProductCreateInputSchema } from "@/domains/products/product-schema";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ProductDialogFormProps = {
  trigger?: React.ReactNode;
  initialValues?: Partial<ProductCreateInput>;
};

export default function ProductDialogForm(props: ProductDialogFormProps) {
  const { initialValues } = props;
  const { open, changeOpen, createProduct } = useProductDialog();

  const defaultValues: ProductCreateInput = useMemo(
    () => ({
      organization: initialValues?.organization ?? "casa_de_los_suenos",
      name: initialValues?.name ?? "",
      variants:
        initialValues?.variants && initialValues.variants.length > 0
          ? initialValues.variants
          : [{ name: "", unitPrice: 0 }],
    }),
    [initialValues]
  );

  const formMethods = useForm<ProductCreateInput>({
    resolver: zodResolver(ProductCreateInputSchema),
    defaultValues,
    mode: "onChange",
  });

  const { control, register, handleSubmit, formState, reset } = formMethods;
  const { errors, isSubmitting, isValid } = formState;

  const {
    fields: variants,
    append,
    remove,
  } = useFieldArray({
    name: "variants",
    control,
  });

  const onSubmit = async (values: ProductCreateInput) => {
    try {
      await createProduct(values);
      reset(defaultValues);
    } catch (error) {
      toast.error("Error al crear el producto");
      console.error(error);
    }
  };

  const handleCancel = () => {
    reset(defaultValues);
    changeOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Crear producto</DialogTitle>
        </DialogHeader>

        <FormProvider {...formMethods}>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="organization">Organización</Label>
              <select
                id="organization"
                {...register("organization")}
                className="border-input bg-transparent h-9 w-full rounded-md border px-3 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                {organizationEnumValues.map(org => (
                  <option key={org} value={org}>
                    {org}
                  </option>
                ))}
              </select>
              {errors.organization ? (
                <p className="text-sm text-red-600">
                  {errors.organization.message}
                </p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                placeholder="Ej. Coca-Cola"
                {...register("name")}
              />
              {errors.name ? (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              ) : null}
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Variantes</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ name: "", unitPrice: 0 })}
                >
                  Agregar variante
                </Button>
              </div>

              <div className="grid gap-3">
                {variants.map((field, index) => {
                  const variantNamePath = `variants.${index}.name` as const;
                  const unitPricePath = `variants.${index}.unitPrice` as const;
                  return (
                    <div
                      key={field.id}
                      className="flex flex-row gap-2 items-center justify-between"
                    >
                      <div className="flex-1">
                        <Label htmlFor={`variant-name-${index}`}>Nombre</Label>
                        <Input
                          id={`variant-name-${index}`}
                          placeholder="Ej. 350ml"
                          {...register(variantNamePath)}
                        />
                        <p className="text-sm min-h-4 text-red-600">
                          {errors.variants?.[index]?.name
                            ? errors.variants[index]?.name?.message
                            : null}
                        </p>
                      </div>

                      <div className="flex-1">
                        <Label htmlFor={`variant-price-${index}`}>Precio</Label>
                        <Controller
                          control={control}
                          name={unitPricePath}
                          render={({ field: { value, onChange, onBlur } }) => (
                            <NumericFormat
                              id={`variant-price-${index}`}
                              value={value ?? ""}
                              thousandSeparator=","
                              allowNegative={false}
                              inputMode="numeric"
                              onBlur={onBlur}
                              prefix="$"
                              customInput={Input}
                              onValueChange={({ floatValue }) =>
                                onChange(floatValue ?? 0)
                              }
                            />
                          )}
                        />
                        <p className="text-sm min-h-4 text-red-600">
                          {errors.variants?.[index]?.unitPrice
                            ? errors.variants[index]?.unitPrice?.message
                            : null}
                        </p>
                      </div>

                      <div className="col-span-1 flex justify-end">
                        <Button
                          className={cn(
                            "p-0",
                            variants.length <= 1 &&
                              "opacity-50 disabled:cursor-not-allowed disabled:pointer-events-auto"
                          )}
                          type="button"
                          variant="outline"
                          disabled={variants.length <= 1}
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {typeof errors.variants?.message === "string" ? (
                  <p className="text-sm text-red-600">
                    {errors.variants?.message}
                  </p>
                ) : null}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!isValid || isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </DialogFooter>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
