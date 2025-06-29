<script lang="ts">
	import * as Form from '$lib/components/ui/form/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import Textarea from '$lib/components/ui/textarea/textarea.svelte';
	import { formSchema, type FormSchema } from './schema';
	import { filesSchema, type FilesSchema } from './schema';
	import { type SuperValidated, type Infer, superForm } from 'sveltekit-superforms';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { Dropzone } from '$lib/components/ui/dropzone/index.js';
	import Label from '$lib/components/ui/label/label.svelte';
	import { Loader2Icon } from 'lucide-svelte'; // Add this import

	let creationMethod = $state<'manual' | 'ai'>('manual');
	let aiFiles: FileList | null = $state(null);
	let fileValidationErrors = $state<string[]>([]);
	let fileInputRef: HTMLInputElement;
	let isSubmitting = $state(false); // Add this state

	// Topic selection state
	let selectedTopicId = $state('');
	let newTopicName = $state('');
	let isCreatingNewTopic = $state(false);

	$effect(() => {
		$formData.creationMethod = creationMethod;
	});

	// Handle topic selection/creation
	$effect(() => {
		if (isCreatingNewTopic) {
			$formData.lessonTopicId = undefined;
			$formData.newTopicName = newTopicName;
		} else if (selectedTopicId) {
			$formData.lessonTopicId = parseInt(selectedTopicId, 10);
			$formData.newTopicName = undefined;
		} else {
			$formData.lessonTopicId = undefined;
			$formData.newTopicName = undefined;
		}
	});

	// Connect aiFiles to form and validate
	$effect(() => {
		if (aiFiles && aiFiles.length > 0) {
			const fileArray = Array.from(aiFiles);
			$formData.files = fileArray;
			
			// Also update the hidden file input
			if (fileInputRef) {
				const dataTransfer = new DataTransfer();
				fileArray.forEach(file => dataTransfer.items.add(file));
				fileInputRef.files = dataTransfer.files;
			}
			
			const validationResult = filesSchema.safeParse(fileArray);
			
			if (validationResult.success) {
				fileValidationErrors = [];
			} else {
				fileValidationErrors = validationResult.error.errors.map(err => err.message);
			}
		} else {
			$formData.files = undefined;
			if (fileInputRef) {
				fileInputRef.files = null;
			}
			fileValidationErrors = [];
		}
	});


	let {
		data
	}: {
		data: {
			form: SuperValidated<Infer<FormSchema>>;
			lessonTopics: Array<{ id: number; name: string }>;
		};
	} = $props();

	const form = superForm(data.form, {
		validators: zodClient(formSchema),
		onSubmit: ({ formData, cancel }) => {
			// Check if it's AI creation method
			const method = formData.get('creationMethod');
			if (method === 'ai') {
				isSubmitting = true;
			}
		},
		onResult: ({ result }) => {
			// Reset loading state on any result
			isSubmitting = false;
		},
		onError: () => {
			// Reset loading state on error
			isSubmitting = false;
		}
	});

	const { form: formData, enhance } = form;


	function formatDateForInput(date: Date | null | undefined): string {
		if (!date) return '';
		return date.toISOString().split('T')[0];
	}

	function parseDateFromInput(dateString: string): Date | undefined {
		return dateString ? new Date(dateString) : undefined;
	}

	let dueDateString = $state(formatDateForInput($formData.dueDate));
	

	$effect(() => {
		$formData.dueDate = parseDateFromInput(dueDateString);
	});
</script>

<!-- Loading Overlay -->
{#if isSubmitting && creationMethod === 'ai'}
    <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-xl flex flex-col items-center space-y-4 max-w-sm mx-4">
            <Loader2Icon class="h-12 w-12 animate-spin text-blue-600" />
            <div class="text-center">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Generating Lesson with AI
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Please wait while we create your lesson content...
                </p>
            </div>
        </div>
    </div>
{/if}

<form
	method="POST"
	action="?/createLesson"
	class="w-2/3 space-y-6"
	enctype="multipart/form-data"
	use:enhance
>
	<!-- Title and Description fields remain the same -->
	<Form.Field {form} name="title">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Title</Form.Label>
				<Input {...props} bind:value={$formData.title} placeholder="Enter the lesson title" />
			{/snippet}
		</Form.Control>
		<Form.Description>Provide a clear and descriptive title for your lesson.</Form.Description>
		<Form.FieldErrors />
	</Form.Field>

	<Form.Field {form} name="description">
		<Form.Control>
			{#snippet children({ props })}
				<Form.Label>Description</Form.Label>
				<Textarea
					{...props}
					bind:value={$formData.description}
					placeholder="Describe what students will learn in this lesson"
					rows={4}
				/>
			{/snippet}
		</Form.Control>
		<Form.Description>
			Briefly describe the lesson content and learning objectives (max 500 characters).
		</Form.Description>
		<Form.FieldErrors />
	</Form.Field>

	<!-- Updated Topic selection -->
	<div class="grid grid-cols-6 lg:grid-cols-12 gap-4">
		<div class="col-span-6">
			<Form.Field {form} name="lessonTopicId">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Topic</Form.Label>
						{#if isCreatingNewTopic}
							<div class="relative">
								<Input
									bind:value={newTopicName}
									placeholder="Enter new topic name"
									class="w-full pr-8"
								/>
								<button
									type="button"
									class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
									onclick={() => {
										isCreatingNewTopic = false;
										newTopicName = '';
									}}
									aria-label="Cancel creating new topic"
								>
									<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
						{:else}
							<Select.Root 
								type="single" 
								bind:value={selectedTopicId} 
								name={props.name}
								onValueChange={(value) => {
									if (value === '__create_new__') {
										isCreatingNewTopic = true;
										selectedTopicId = '';
									} else {
										selectedTopicId = value || '';
									}
								}}
							>
								<Select.Trigger {...props} class="w-full truncate">
									<span class="truncate">
										{selectedTopicId
											? data.lessonTopics.find((t) => t.id.toString() === selectedTopicId)?.name ||
												'Select a topic'
											: 'Select a topic'}
									</span>
								</Select.Trigger>
								<Select.Content>
									{#if data.lessonTopics.length === 0}
										<Select.Item value="" label="No topics available" disabled />
									{:else}
										{#each data.lessonTopics as topic}
											<Select.Item value={topic.id.toString()} label={topic.name} />
										{/each}
									{/if}
									<Select.Separator />
									<Select.Item value="__create_new__" label="Create new topic" />
								</Select.Content>
							</Select.Root>
						{/if}
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<!-- Week and Due Date fields remain the same -->
		<div class="col-span-3">
			<Form.Field {form} name="subjectWeek">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Week</Form.Label>
						<Input
							{...props}
							type="number"
							min="0"
							bind:value={$formData.subjectWeek}
							placeholder="1"
						/>
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>

		<div class="col-span-3">
			<Form.Field {form} name="dueDate">
				<Form.Control>
					{#snippet children({ props })}
						<Form.Label>Due Date</Form.Label>
						<Input {...props} type="date" bind:value={dueDateString} />
					{/snippet}
				</Form.Control>
				<Form.FieldErrors />
			</Form.Field>
		</div>
	</div>

	<!-- Rest of your form remains the same -->
	<div class="space-y-2 -mt-5">
		<Tabs.Root bind:value={creationMethod} class="w-full flex">
            <Tabs.List
              class="
                flex space-x-2
                bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600
                dark:bg-gradient-to-r dark:from-blue-500 dark:via-purple-500 dark:to-blue-600
                text-white
                border-0 shadow-lg
                transition-all duration-200
              "
            >
              <Tabs.Trigger
                value="manual"
                class="flex-1 data-[state=active]:shadow-sm data-[state=inactive]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black dark:data-[state=inactive]:text-white"
              >
                Create Manual
              </Tabs.Trigger>
              <Tabs.Trigger
                value="ai"
                class="flex-1 data-[state=active]:shadow-sm data-[state=inactive]:text-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black dark:data-[state=inactive]:text-white "
              >
                Generate with AI
              </Tabs.Trigger>
            </Tabs.List>
            
            <Tabs.Content value="manual" class="mt-1"></Tabs.Content>      
            <Tabs.Content value="ai" class="mt-1 w-full">
				<div class="w-full">
					<!-- Remove Form.Field wrapper and just use the dropzone -->
                    <Label class="text-sm font-medium">Supporting Material (Optional)</Label>
                    <Label class="text-muted-foreground text-sm font-weight-normal font-medium space-y-3">
                        Upload materials for AI to analyse and generate lesson content from.
                    </Label>
                    
                    <!-- Display validation errors -->
                    {#if fileValidationErrors.length > 0}
                        <div class="space-y-1 mt-2">
                            {#each fileValidationErrors as error}
                                <p class="text-sm text-destructive">{error}</p>
                            {/each}
                        </div>
                    {/if}
                    
                    <div class="w-full max-w-none">
                        <Dropzone 
                            bind:files={aiFiles}
                            accept=".png,.jpg,.jpeg,.pdf"
                            multiple={true}
                        />
                    </div>
				</div>
            </Tabs.Content>
        </Tabs.Root>
    </div>

	<!-- Hidden inputs for new topic -->
	<input type="hidden" name="newTopicName" bind:value={$formData.newTopicName} />
	<input type="hidden" name="creationMethod" bind:value={$formData.creationMethod} />

    <!-- Add hidden file input -->
    <input
        bind:this={fileInputRef}
        type="file"
        name="files"
        multiple
        accept=".png,.jpg,.jpeg,.pdf"
        class="hidden"
        aria-hidden="true"
    />

    <div class="flex justify-end gap-2">
        <Form.Button 
            type="submit"
            disabled={fileValidationErrors.length > 0 || isSubmitting}
        >
            {#if isSubmitting && creationMethod === 'ai'}
                <Loader2Icon class="h-4 w-4 animate-spin mr-2" />
                Generating...
            {:else}
                Create
            {/if}
        </Form.Button>
    </div>
</form>
